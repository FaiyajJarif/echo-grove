package com.echogrove.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Fixed-window limits per IP address, plus a 16 KB request body cap.
 * In memory, which is enough for a single instance.
 */
public class RateLimitFilter extends OncePerRequestFilter {

    private static final long MAX_BODY_BYTES = 16 * 1024;
    private static final long MINUTE = 60_000;
    private static final long HOUR = 60 * MINUTE;

    private record Rule(String name, int limit, long windowMs) {
    }

    private static final class Window {
        long start;
        int count;
    }

    private final Map<String, Window> windows = new ConcurrentHashMap<>();
    private final boolean enabled;

    public RateLimitFilter(boolean enabled) {
        this.enabled = enabled;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        if (request.getContentLengthLong() > MAX_BODY_BYTES) {
            ApiErrors.write(response, 413, "Request too large.");
            return;
        }
        Rule rule = enabled ? ruleFor(request) : null;
        if (rule != null) {
            long now = System.currentTimeMillis();
            Window w = windows.compute(request.getRemoteAddr() + "|" + rule.name(), (k, old) -> {
                Window cur = old;
                if (cur == null || now - cur.start >= rule.windowMs()) {
                    cur = new Window();
                    cur.start = now;
                }
                cur.count++;
                return cur;
            });
            if (w.count > rule.limit()) {
                long retry = Math.max(1, (w.start + rule.windowMs() - now) / 1000);
                response.setHeader("Retry-After", String.valueOf(retry));
                ApiErrors.write(response, 429, "Too many requests. Please wait a moment and try again.");
                return;
            }
            if (windows.size() > 20_000) {
                windows.entrySet().removeIf(e -> now - e.getValue().start > HOUR);
            }
        }
        chain.doFilter(request, response);
    }

    private Rule ruleFor(HttpServletRequest request) {
        String path = request.getRequestURI();
        boolean post = "POST".equals(request.getMethod());
        if (post && path.equals("/api/auth/login")) return new Rule("login", 10, MINUTE);
        if (post && path.equals("/api/auth/register")) return new Rule("register", 3, HOUR);
        if (post && path.equals("/api/auth/resend-verification")) return new Rule("resend", 3, HOUR);
        if (path.startsWith("/api/")) return new Rule("api", 120, MINUTE);
        return null;
    }
}

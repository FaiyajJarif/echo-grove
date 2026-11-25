package com.echogrove.security;

import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;

/** Writes a small JSON error body from filters, in the same shape as the API's ProblemDetail errors. */
final class ApiErrors {

    private ApiErrors() {
    }

    static void write(HttpServletResponse response, int status, String detail) throws IOException {
        response.setStatus(status);
        response.setContentType("application/problem+json");
        response.getWriter().write("{\"status\":" + status + ",\"detail\":\"" + detail.replace("\"", "'") + "\"}");
    }
}

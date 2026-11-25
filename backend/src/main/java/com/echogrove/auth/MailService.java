package com.echogrove.auth;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

/**
 * Sends verification emails. With no SMTP configured (local development),
 * the link is written to the server log instead so you can still test the flow.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MailService {

    private final ObjectProvider<JavaMailSender> sender;

    @Value("${echogrove.frontend-url}")
    private String frontendUrl;

    @Value("${echogrove.mail.from}")
    private String from;

    public void sendVerification(String to, String displayName, String rawToken) {
        String link = frontendUrl.replaceAll("/$", "") + "/#/verify?token=" + rawToken;
        JavaMailSender mail = sender.getIfAvailable();
        if (mail == null) {
            log.info("SMTP not configured (dev). Verification link for {}: {}", to, link);
            return;
        }
        SimpleMailMessage msg = new SimpleMailMessage();
        msg.setFrom(from);
        msg.setTo(to);
        msg.setSubject("Verify your Echo Grove account");
        msg.setText("Hi " + displayName + ",\n\nOpen this link to verify your email and start saving gardens:\n"
                + link + "\n\nThe link works once and expires in 24 hours. If you didn't sign up, ignore this email.\n\nEcho Grove");
        try {
            mail.send(msg);
        } catch (MailException e) {
            log.warn("Could not send the verification email to {}: {}", to, e.getMessage());
        }
    }
}

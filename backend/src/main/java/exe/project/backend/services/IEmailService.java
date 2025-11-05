package exe.project.backend.services;

import jakarta.mail.MessagingException;

public interface IEmailService {
    void sendEmail(String to, String subject, String body) throws MessagingException;
}

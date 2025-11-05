package exe.project.backend.enums;

public enum Role {
    USER("user"),
    ADMIN("admin");
    private String role;

    Role(String role) {
        this.role = role;
    }
}

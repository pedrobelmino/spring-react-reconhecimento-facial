package db.migration;

import java.sql.PreparedStatement;
import org.flywaydb.core.api.migration.BaseJavaMigration;
import org.flywaydb.core.api.migration.Context;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class V2__SeedAdmin extends BaseJavaMigration {

    @Override
    public void migrate(Context context) throws Exception {
        String password = System.getenv().getOrDefault("ADMIN_PASSWORD", "admin123");
        String hash = new BCryptPasswordEncoder().encode(password);

        try (PreparedStatement statement = context.getConnection().prepareStatement("""
                INSERT INTO admin_user (username, password_hash, created_at)
                SELECT ?, ?, CURRENT_TIMESTAMP
                WHERE NOT EXISTS (SELECT 1 FROM admin_user WHERE username = ?)
                """)) {
            statement.setString(1, "admin");
            statement.setString(2, hash);
            statement.setString(3, "admin");
            statement.executeUpdate();
        }
    }
}

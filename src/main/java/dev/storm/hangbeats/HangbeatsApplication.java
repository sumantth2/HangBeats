package dev.storm.hangbeats;

import dev.storm.hangbeats.config.JwtProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

@SpringBootApplication
@EnableConfigurationProperties(JwtProperties.class)
public class HangbeatsApplication {

    public static void main(String[] args) {
        loadDotEnvIntoSystemProperties();
        SpringApplication.run(HangbeatsApplication.class, args);
    }

    private static void loadDotEnvIntoSystemProperties() {
        Path envFile = Path.of(".env");
        if (!Files.exists(envFile)) {
            return;
        }

        try {
            List<String> lines = Files.readAllLines(envFile, StandardCharsets.UTF_8);
            for (String rawLine : lines) {
                String line = rawLine.trim();
                if (line.isEmpty() || line.startsWith("#")) {
                    continue;
                }

                int splitIndex = line.indexOf('=');
                if (splitIndex <= 0) {
                    continue;
                }

                String key = line.substring(0, splitIndex).trim();
                String value = line.substring(splitIndex + 1).trim();

                if ((value.startsWith("\"") && value.endsWith("\"")) || (value.startsWith("'") && value.endsWith("'"))) {
                    value = value.substring(1, value.length() - 1);
                }

                setSystemPropertyIfMissing(key, value);
                setSystemPropertyIfMissing(key.toLowerCase().replace('_', '.'), value);
            }
        } catch (IOException ignored) {
            // Local .env loading is best-effort only.
        }
    }

    private static void setSystemPropertyIfMissing(String key, String value) {
        if (System.getenv(key) == null && System.getProperty(key) == null) {
            System.setProperty(key, value);
        }
    }
}

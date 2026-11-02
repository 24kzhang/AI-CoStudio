package com.zys.backend.config;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.boot.test.context.ConfigDataApplicationContextInitializer;
import org.springframework.context.annotation.AnnotationConfigApplicationContext;
import org.springframework.test.context.support.TestPropertySourceUtils;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.assertEquals;

class ModelConfigTest {
    @TempDir
    Path directory;

    @Test
    void loadsLocalGatewayAndPreservesOverrides() throws Exception {
        Path file = directory.resolve("model.properties");
        Files.write(file, "MODEL_BASE_URL=http://model.example:30066\n".getBytes(StandardCharsets.UTF_8));
        try (AnnotationConfigApplicationContext context = new AnnotationConfigApplicationContext()) {
            TestPropertySourceUtils.addInlinedPropertiesToEnvironment(context,
                    "GALLERY_MODEL_CONFIG=" + file,
                    "AGENT_PLANNER_BASE_URL=https://planner.example/v1");
            new ConfigDataApplicationContextInitializer().initialize(context);
            assertEquals("http://model.example:30066", context.getEnvironment().getProperty("qwenImage.baseUrl"));
            assertEquals("https://planner.example/v1", context.getEnvironment().getProperty("agent.planner.baseUrl"));
        }
    }

    @Test
    void sharedEnvironmentOverridesLocalFile() throws Exception {
        Path file = directory.resolve("model.properties");
        Files.write(file, "MODEL_BASE_URL=http://model.example:30066\n".getBytes(StandardCharsets.UTF_8));
        try (AnnotationConfigApplicationContext context = new AnnotationConfigApplicationContext()) {
            TestPropertySourceUtils.addInlinedPropertiesToEnvironment(context,
                    "GALLERY_MODEL_CONFIG=" + file,
                    "MODEL_BASE_URL=https://override.example");
            new ConfigDataApplicationContextInitializer().initialize(context);
            assertEquals("https://override.example", context.getEnvironment().getProperty("qwenImage.baseUrl"));
            assertEquals("https://override.example/qwen-vl/v1", context.getEnvironment().getProperty("agent.planner.baseUrl"));
        }
    }
}

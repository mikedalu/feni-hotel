package com.backend.feni.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Path;
import java.nio.file.Paths;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    private final String storagePath;

    public WebConfig(@Value("${storage.local.path}") String storagePath) {
        // Ensure path starts with "file:" for ResourceHandler
        Path absolutePath = Paths.get(storagePath).toAbsolutePath().normalize();
        this.storagePath = "file:" + absolutePath.toString() + "/";
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations(this.storagePath);
    }
}

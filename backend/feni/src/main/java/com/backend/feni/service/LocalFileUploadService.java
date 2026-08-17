package com.backend.feni.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Base64;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

@Service
@Slf4j
public class LocalFileUploadService {

    private final Path storagePath;

    public LocalFileUploadService(@Value("${storage.local.path}") String storagePathStr) {
        this.storagePath = Paths.get(storagePathStr).toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.storagePath);
            log.info("Initialized Local Storage at {}", this.storagePath);
        } catch (IOException e) {
            throw new RuntimeException("Could not initialize local storage directory at " + this.storagePath, e);
        }
    }

    /**
     * Uploads a base64 encoded image to the local file system asynchronously.
     * @param base64Image The base64 string of the image
     * @param facilityId The ID of the facility for path organization
     * @return CompletableFuture containing the final public URL of the uploaded image
     */
    @Async
    public CompletableFuture<String> uploadIdScanAsync(String base64Image, UUID facilityId) {
        try {
            // Strip data URL prefix if present (e.g. data:image/jpeg;base64,)
            String base64Data = base64Image;
            String contentType = "image/jpeg"; // Default
            
            if (base64Image.contains(",")) {
                String[] parts = base64Image.split(",");
                String meta = parts[0];
                base64Data = parts[1];
                if (meta.contains("image/png")) {
                    contentType = "image/png";
                }
            }

            byte[] imageBytes = Base64.getDecoder().decode(base64Data);
            String extension = contentType.equals("image/png") ? ".png" : ".jpg";
            String relativePath = "scans/" + facilityId.toString() + "/" + UUID.randomUUID().toString() + extension;
            
            Path destinationFile = this.storagePath.resolve(relativePath);
            Files.createDirectories(destinationFile.getParent());
            Files.write(destinationFile, imageBytes);
            
            log.info("Successfully saved ID scan to local storage: {}", relativePath);

            String fullUrl = buildPublicUrl(relativePath);
            return CompletableFuture.completedFuture(fullUrl);

        } catch (Exception e) {
            log.error("Failed to save ID scan to local storage", e);
            // We do not rethrow since this is @Async and shouldn't fail the calling transaction
            return CompletableFuture.completedFuture(null);
        }
    }

    public String uploadReportPdf(byte[] pdfBytes, UUID facilityId, String reportName) {
        try {
            String relativePath = "reports/" + facilityId.toString() + "/" + reportName + ".pdf";
            
            Path destinationFile = this.storagePath.resolve(relativePath);
            Files.createDirectories(destinationFile.getParent());
            Files.write(destinationFile, pdfBytes);

            log.info("Successfully saved report PDF to local storage: {}", relativePath);
            
            return buildPublicUrl(relativePath);
        } catch (Exception e) {
            log.error("Failed to save report PDF to local storage", e);
            throw new RuntimeException("Failed to save report to local storage", e);
        }
    }
    
    private String buildPublicUrl(String relativePath) {
        // Build URL matching the static resource handler (e.g. http://hotel-hub.local:8080/uploads/...)
        try {
            return ServletUriComponentsBuilder.fromCurrentContextPath()
                    .path("/uploads/")
                    .path(relativePath)
                    .toUriString();
        } catch (Exception e) {
            // Fallback for async contexts where current request is not available
            log.warn("Could not determine current context path, falling back to relative URL");
            return "/uploads/" + relativePath;
        }
    }
}

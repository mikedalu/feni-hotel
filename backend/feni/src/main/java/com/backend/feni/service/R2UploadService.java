package com.backend.feni.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectResponse;

import java.net.URI;
import java.util.Base64;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

@Service
@Slf4j
public class R2UploadService {

    private final S3Client s3Client;
    private final String bucketName;
    private final String publicUrl;

    public R2UploadService(
            @Value("${r2.bucket}") String bucketName,
            @Value("${r2.access-key}") String accessKey,
            @Value("${r2.secret-key}") String secretKey,
            @Value("${r2.endpoint}") String endpoint,
            @Value("${r2.public-url}") String publicUrl) {
        
        this.bucketName = bucketName;
        this.publicUrl = publicUrl;

        AwsBasicCredentials credentials = AwsBasicCredentials.create(accessKey, secretKey);

        this.s3Client = S3Client.builder()
                .credentialsProvider(StaticCredentialsProvider.create(credentials))
                .endpointOverride(URI.create(endpoint))
                .region(Region.of("auto")) // Cloudflare R2 uses 'auto'
                .build();
    }

    /**
     * Uploads a base64 encoded image to R2 asynchronously.
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
            String objectKey = "scans/" + facilityId.toString() + "/" + UUID.randomUUID().toString() + extension;

            PutObjectRequest putOb = PutObjectRequest.builder()
                    .bucket(bucketName)
                    .key(objectKey)
                    .contentType(contentType)
                    .build();

            log.info("Uploading ID scan to R2: {}", objectKey);
            PutObjectResponse response = s3Client.putObject(putOb, RequestBody.fromBytes(imageBytes));
            log.info("Successfully uploaded ID scan to R2 with ETag: {}", response.eTag());

            String fullUrl = publicUrl.endsWith("/") ? publicUrl + objectKey : publicUrl + "/" + objectKey;
            return CompletableFuture.completedFuture(fullUrl);

        } catch (Exception e) {
            log.error("Failed to upload ID scan to R2", e);
            // We do not rethrow since this is @Async and shouldn't fail the calling transaction
            return CompletableFuture.completedFuture(null);
        }
    }

    public String uploadReportPdf(byte[] pdfBytes, UUID facilityId, String reportName) {
        try {
            String objectKey = "reports/" + facilityId.toString() + "/" + reportName + ".pdf";

            PutObjectRequest putOb = PutObjectRequest.builder()
                    .bucket(bucketName)
                    .key(objectKey)
                    .contentType("application/pdf")
                    .build();

            log.info("Uploading report PDF to R2: {}", objectKey);
            s3Client.putObject(putOb, RequestBody.fromBytes(pdfBytes));
            
            String fullUrl = publicUrl.endsWith("/") ? publicUrl + objectKey : publicUrl + "/" + objectKey;
            return fullUrl;
        } catch (Exception e) {
            log.error("Failed to upload report PDF to R2", e);
            throw new RuntimeException("Failed to upload report to cloud storage", e);
        }
    }
}

package com.taskmanager.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.UUID;

@Service
public class FileStorageService {

    @Value("${supabase.url}")
    private String supabaseUrl;

    @Value("${supabase.key}")
    private String supabaseKey;

    @Value("${supabase.storage.bucket:contratos}")
    private String storageBucket;

    private final RestTemplate restTemplate;

    public FileStorageService() {
        this.restTemplate = new RestTemplate();
    }

    /**
     * Upload a file to Supabase Storage
     * @param file The file to upload
     * @param folder The folder within the bucket (optional)
     * @return The public URL of the uploaded file
     */
    public String uploadFile(MultipartFile file, String folder) {
        try {
            // Generate unique filename
            String originalFilename = file.getOriginalFilename();
            String extension = originalFilename != null && originalFilename.contains(".") 
                ? originalFilename.substring(originalFilename.lastIndexOf("."))
                : ".pdf";
            String uniqueFilename = UUID.randomUUID().toString() + extension;
            
            // Build the path
            String filePath = folder != null && !folder.isEmpty() 
                ? folder + "/" + uniqueFilename 
                : uniqueFilename;

            // Build the upload URL
            String uploadUrl = supabaseUrl + "/storage/v1/object/" + storageBucket + "/" + filePath;

            // Set headers
            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", "Bearer " + supabaseKey);
            headers.set("apikey", supabaseKey);
            headers.setContentType(MediaType.valueOf(file.getContentType() != null ? file.getContentType() : "application/pdf"));

            // Create request entity
            HttpEntity<byte[]> requestEntity = new HttpEntity<>(file.getBytes(), headers);

            // Upload file
            ResponseEntity<String> response = restTemplate.exchange(
                uploadUrl,
                HttpMethod.POST,
                requestEntity,
                String.class
            );

            if (response.getStatusCode().is2xxSuccessful()) {
                // Return public URL
                return supabaseUrl + "/storage/v1/object/public/" + storageBucket + "/" + filePath;
            } else {
                throw new RuntimeException("Error al subir archivo: " + response.getStatusCode());
            }

        } catch (IOException e) {
            throw new RuntimeException("Error al leer el archivo: " + e.getMessage(), e);
        } catch (Exception e) {
            throw new RuntimeException("Error al subir archivo a storage: " + e.getMessage(), e);
        }
    }

    /**
     * Delete a file from Supabase Storage
     * @param fileUrl The public URL of the file to delete
     */
    public void deleteFile(String fileUrl) {
        if (fileUrl == null || fileUrl.isEmpty()) {
            return;
        }

        try {
            // Extract file path from URL
            String basePath = supabaseUrl + "/storage/v1/object/public/" + storageBucket + "/";
            if (!fileUrl.startsWith(basePath)) {
                return;
            }

            String filePath = fileUrl.substring(basePath.length());
            String deleteUrl = supabaseUrl + "/storage/v1/object/" + storageBucket + "/" + filePath;

            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", "Bearer " + supabaseKey);
            headers.set("apikey", supabaseKey);

            HttpEntity<Void> requestEntity = new HttpEntity<>(headers);

            restTemplate.exchange(
                deleteUrl,
                HttpMethod.DELETE,
                requestEntity,
                String.class
            );

        } catch (Exception e) {
            System.err.println("Error al eliminar archivo: " + e.getMessage());
        }
    }
}

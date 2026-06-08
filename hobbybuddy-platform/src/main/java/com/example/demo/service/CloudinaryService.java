package com.example.demo.service;

import java.io.IOException;
import org.springframework.web.multipart.MultipartFile;
import com.example.demo.model.PhotoInfo;

/**
 * Minimal wrapper around Cloudinary upload functionality.
 * The real implementation can be swapped out – tests mock this interface.
 */
public interface CloudinaryService {
    /**
     * Upload a file for the given user and return a {@link PhotoInfo} containing the public URL and Cloudinary public ID.
     */
    PhotoInfo upload(MultipartFile file, Long userId) throws IOException;
}

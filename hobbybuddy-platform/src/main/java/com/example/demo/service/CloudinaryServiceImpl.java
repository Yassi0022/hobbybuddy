package com.example.demo.service;

import com.example.demo.model.PhotoInfo;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

/**
 * Stub Cloudinary implementation for development/testing.
 * Throws UnsupportedOperationException – replace with real Cloudinary SDK integration.
 */
@Component
@Profile("!test")
public class CloudinaryServiceImpl implements CloudinaryService {

    @Override
    public PhotoInfo upload(MultipartFile file, Long userId) throws IOException {
        throw new UnsupportedOperationException(
                "Cloudinary upload not implemented. Configure a real CloudinaryService bean.");
    }
}

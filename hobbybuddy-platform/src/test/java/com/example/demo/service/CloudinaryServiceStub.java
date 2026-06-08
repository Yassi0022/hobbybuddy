package com.example.demo.service;

import com.example.demo.model.PhotoInfo;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

/**
 * Test stub for CloudinaryService – returns a fake PhotoInfo.
 */
@Component
@Profile("test")
public class CloudinaryServiceStub implements CloudinaryService {

    @Override
    public PhotoInfo upload(MultipartFile file, Long userId) throws IOException {
        return new PhotoInfo("https://example.com/" + file.getOriginalFilename(), "stub-" + userId);
    }
}

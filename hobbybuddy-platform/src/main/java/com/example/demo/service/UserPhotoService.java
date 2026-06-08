package com.example.demo.service;

import com.example.demo.model.PhotoInfo;
import com.example.demo.model.User;
import com.example.demo.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@Service
public class UserPhotoService {

    private final CloudinaryService cloudinaryService;
    private final UserRepository userRepository;

    @Value("${app.photo.max-size-bytes:5242880}") // default 5 MB
    private long maxFileSize;

    private static final List<String> SUPPORTED_TYPES = List.of("image/jpeg", "image/png", "image/webp", "image/gif");

    public UserPhotoService(CloudinaryService cloudinaryService, UserRepository userRepository) {
        this.cloudinaryService = cloudinaryService;
        this.userRepository = userRepository;
    }

    /**
     * Validates the file, uploads to Cloudinary, and appends the result to the user's photo list.
     * Enforces a maximum of 3 photos per user.
     */
    public PhotoInfo addPhoto(User user, MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File must not be empty");
        }
        String contentType = file.getContentType();
        if (contentType == null || !SUPPORTED_TYPES.contains(contentType.toLowerCase())) {
            throw new IllegalArgumentException("Unsupported image type: " + contentType);
        }
        if (file.getSize() > maxFileSize) {
            throw new IllegalArgumentException("File exceeds max size of " + maxFileSize + " bytes");
        }
        List<PhotoInfo> photos = user.getPhotoList();
        if (photos != null && photos.size() >= 3) {
            throw new IllegalStateException("Maximum of 3 photos allowed");
        }
        PhotoInfo info = cloudinaryService.upload(file, user.getId());
        if (photos == null) {
            photos = new java.util.ArrayList<>();
            user.setPhotoList(photos);
        }
        photos.add(info);
        user.setPhotosJson(null); // clear legacy JSON column
        userRepository.save(user);
        return info;
    }
}

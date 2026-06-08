package com.example.demo.service;

import com.example.demo.model.PhotoInfo;
import com.example.demo.model.User;
import com.example.demo.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.multipart.MultipartFile;

import org.springframework.test.util.ReflectionTestUtils;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserPhotoServiceTest {

    @Mock
    private CloudinaryService cloudinaryService;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private UserPhotoService userPhotoService;

    private User user;

    @BeforeEach
    void setUp() {
        // @Value is not injected by Mockito — set maxFileSize manually (5 MB default)
        ReflectionTestUtils.setField(userPhotoService, "maxFileSize", 5242880L);
        user = new User();
        user.setId(1L);
        // start with empty photo list
        user.setPhotoList(new ArrayList<>());
    }

    @Test
    void uploadRejectsUnsupportedType() {
        MultipartFile file = new MockMultipartFile("file", "test.txt", "text/plain", "data".getBytes());
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> userPhotoService.addPhoto(user, file));
        assertTrue(ex.getMessage().contains("Unsupported image type"));
    }

    @Test
    void uploadRejectsOversizedFile() {
        byte[] big = new byte[6 * 1024 * 1024]; // 6 MB
        MultipartFile file = new MockMultipartFile("file", "big.png", "image/png", big);
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> userPhotoService.addPhoto(user, file));
        assertTrue(ex.getMessage().contains("File exceeds max size"));
    }

    @Test
    void addPhotoSuccessful() throws IOException {
        MultipartFile file = new MockMultipartFile("file", "img.png", "image/png", "data".getBytes());
        PhotoInfo mockInfo = new PhotoInfo("https://example.com/img.png", "publicId123");
        when(cloudinaryService.upload(any(MultipartFile.class), eq(user.getId()))).thenReturn(mockInfo);
        PhotoInfo result = userPhotoService.addPhoto(user, file);
        assertEquals(mockInfo, result);
        verify(userRepository).save(user);
        assertEquals(1, user.getPhotoList().size());
        assertNull(user.getPhotosJson()); // legacy cleared
    }

    @Test
    void cannotAddMoreThanThreePhotos() throws IOException {
        // Fill with three existing photos
        List<PhotoInfo> list = new ArrayList<>();
        list.add(new PhotoInfo("url1", "id1"));
        list.add(new PhotoInfo("url2", "id2"));
        list.add(new PhotoInfo("url3", "id3"));
        user.setPhotoList(list);
        MultipartFile file = new MockMultipartFile("file", "img.png", "image/png", "data".getBytes());
        IllegalStateException ex = assertThrows(IllegalStateException.class, () -> userPhotoService.addPhoto(user, file));
        assertTrue(ex.getMessage().contains("Maximum of 3 photos allowed"));
    }
}

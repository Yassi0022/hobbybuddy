package com.example.demo.model;

import java.util.Objects;

/**
 * Simple DTO representing an uploaded photo.
 * Stored in the user's {@code photoList} (transient) and optionally persisted as JSON via {@code photosJson}.
 */
public class PhotoInfo {
    private String url;
    private String publicId;

    public PhotoInfo() {}

    public PhotoInfo(String url, String publicId) {
        this.url = url;
        this.publicId = publicId;
    }

    public String getUrl() {
        return url;
    }

    public void setUrl(String url) {
        this.url = url;
    }

    public String getPublicId() {
        return publicId;
    }

    public void setPublicId(String publicId) {
        this.publicId = publicId;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof PhotoInfo)) return false;
        PhotoInfo that = (PhotoInfo) o;
        return Objects.equals(url, that.url) && Objects.equals(publicId, that.publicId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(url, publicId);
    }

    @Override
    public String toString() {
        return "PhotoInfo{" + "url='" + url + '\'' + ", publicId='" + publicId + '\'' + '}';
    }
}

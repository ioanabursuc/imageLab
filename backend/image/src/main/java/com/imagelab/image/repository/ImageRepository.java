package com.imagelab.image.repository;

import com.imagelab.image.entity.Image;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ImageRepository extends JpaRepository<Image, Long> {
    List<Image> findByUserId(Long userId);
    Optional<Image> findByIdAndUserId(Long id, Long userId);
}
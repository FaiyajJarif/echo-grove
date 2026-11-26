package com.echogrove.garden;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface GardenRepository extends JpaRepository<Garden, String> {

    /** Public gallery: published and not hidden. */
    List<Garden> findByPublishedTrueAndHiddenFalseOrderByCreatedAtDesc(Pageable pageable);

    List<Garden> findByOwnerIdOrderByCreatedAtDesc(Long ownerId, Pageable pageable);

    List<Garden> findAllByOrderByCreatedAtDesc(Pageable pageable);

    long countByPublishedTrue();

    long countByHiddenTrue();

    long countByOwnerId(Long ownerId);

    void deleteByOwnerId(Long ownerId);
}

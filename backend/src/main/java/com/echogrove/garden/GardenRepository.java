package com.echogrove.garden;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface GardenRepository extends JpaRepository<Garden, String> {

    List<Garden> findAllByOrderByCreatedAtDesc(Pageable pageable);
}

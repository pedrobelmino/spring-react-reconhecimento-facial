package br.com.academia.faceaccess.web.dto;

import java.time.Instant;

public record AdminUserDto(Long id, String username, Instant createdAt) {}

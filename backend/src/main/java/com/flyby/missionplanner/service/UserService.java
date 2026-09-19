package com.flyby.missionplanner.service;

import com.flyby.missionplanner.entity.Role;
import com.flyby.missionplanner.entity.User;
import com.flyby.missionplanner.exception.NotFoundException;
import com.flyby.missionplanner.repository.UserRepository;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public Map<String, Object> getById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("User not found: " + id));
        return Map.of("id", user.getId(), "email", user.getEmail());
    }

    public List<Map<String, Object>> listByRole(Role role) {
        return userRepository.findAll().stream()
                .filter(u -> role == null || u.getRole() == role)
                .map(u -> Map.<String, Object>of("id", u.getId(), "email", u.getEmail()))
                .toList();
    }
}

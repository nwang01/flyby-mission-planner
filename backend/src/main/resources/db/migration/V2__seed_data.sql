-- BCrypt Hash（strength 12）
-- admin1@flyby.com / admin1pass
-- admin2@flyby.com / admin2pass
-- pilot1@flyby.com / pilot1pass
-- pilot2@flyby.com / pilot2pass
-- pilot3@flyby.com / pilot3pass

INSERT INTO users (email, password_hash, role) VALUES
    ('admin1@flyby.com', '$2a$12$pTbpPDQAsYVD2C3PFOGoP.vgWVsYXeEDP7MeU/gneeiUG7Uik9oB2', 'ADMIN'),
    ('admin2@flyby.com', '$2a$12$JWbx.AqbWzz3HDhU9sE6vuRkzKoH/A8CYV/28kT/6bPO66y01FMTW', 'ADMIN'),
    ('pilot1@flyby.com', '$2a$12$e6oPPq3YpK8a3zXDRUxiJOAJeU8Zlfq.KwOm7c6y9LvsdNrGxAxJm', 'PILOT'),
    ('pilot2@flyby.com', '$2a$12$OqG0eLSjKEQEAUMg96HlYeR5gdjJjyj/Uuy.TiktEYhuGzINvJDoC', 'PILOT'),
    ('pilot3@flyby.com', '$2a$12$HzHTWSlayEeFyzQAk5ezju3XH0Cjh326ZZzc3VKQ.46oMtKABZQ2S', 'PILOT');
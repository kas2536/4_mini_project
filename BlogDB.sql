DROP TABLE IF EXISTS blogs;
DROP TABLE IF EXISTS users;

-- Create Users Table
CREATE TABLE users (
    user_id VARCHAR(255) PRIMARY KEY,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL
);

-- Create Blogs Table
CREATE TABLE blogs (
    blog_id SERIAL PRIMARY KEY,
    creator_name VARCHAR(255) NOT NULL,
    creator_user_id VARCHAR(255) REFERENCES users(user_id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    category VARCHAR(100) DEFAULT 'General',
    date_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed Users
INSERT INTO users (user_id, password, name) VALUES
('johndoe', 'password123', 'John Doe'),
('janesmith', 'securepass', 'Jane Smith'),
('alexdev', 'coder2026', 'Alex Developer');

-- Seed Blogs
INSERT INTO blogs (creator_name, creator_user_id, title, body, category, date_created) VALUES
('John Doe', 'johndoe', 'Migrating to PostgreSQL', 'Persisting state across sessions using relational databases changes everything for Express applications.', 'Tech', NOW() - INTERVAL '2 days'),
('Jane Smith', 'janesmith', 'Mastering Express Sessions', 'Authentication relies on keeping secure user context across stateless HTTP requests.', 'Education', NOW() - INTERVAL '1 day'),
('Alex Developer', 'alexdev', 'Designing Scalable SQL Schemas', 'Foreign keys ensure referential integrity between user accounts and created assets.', 'Tech', NOW() - INTERVAL '12 hours'),
('John Doe', 'johndoe', 'Morning Routines for Programmers', 'A structured routine with morning coffee and zero context switching leads to better productivity.', 'Lifestyle', NOW() - INTERVAL '5 hours'),
('Jane Smith', 'janesmith', 'Welcome to Mini-Project 3', 'This blog platform now enforces row-level ownership so users can only edit or delete their own posts!', 'General', NOW());
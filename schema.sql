CREATE TABLE IF NOT EXISTS records (
  id SERIAL PRIMARY KEY,
  title VARCHAR(80) NOT NULL CHECK (char_length(title) >= 3),
  category VARCHAR(40) NOT NULL CHECK (char_length(category) >= 2),
  description VARCHAR(300) NOT NULL CHECK (char_length(description) >= 5),
  status VARCHAR(20) NOT NULL CHECK (status IN ('Pending', 'In progress', 'Completed'))
);
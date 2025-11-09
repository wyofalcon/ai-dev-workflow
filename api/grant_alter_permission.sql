-- Grant ALTER permission to cvstomize_app user
GRANT ALL PRIVILEGES ON TABLE personality_traits TO cvstomize_app;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO cvstomize_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO cvstomize_app;

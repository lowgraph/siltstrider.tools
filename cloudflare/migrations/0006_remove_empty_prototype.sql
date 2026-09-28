-- Retire the empty prototype table. Refuse if any rows appeared since review.
CREATE TABLE _prototype_retirement_guard (
  row_count INTEGER NOT NULL CHECK (row_count = 0)
);
INSERT INTO _prototype_retirement_guard SELECT count(*) FROM saved_characters;
DROP TABLE saved_characters;
DROP TABLE _prototype_retirement_guard;

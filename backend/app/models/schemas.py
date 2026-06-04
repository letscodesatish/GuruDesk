from pydantic import BaseModel, Field
from typing import List

# 1. Define what a single week of teaching looks like
class RoadmapWeek(BaseModel):
    week_number: int = Field(description="The week number in the semester (e.g., 1, 2, 3)")
    topics_to_cover: List[str] = Field(description="Specific topics from the syllabus to teach this week")
    learning_outcome: str = Field(description="What the students should understand by the end of this week")

# 2. Define the final output structure
class RoadmapResponse(BaseModel):
    course_title: str
    total_weeks: int
    roadmap: List[RoadmapWeek]

# 3. Define what the frontend will ask for
class RoadmapRequest(BaseModel):
    subject: str
    weeks: int = 14 # Defaulting to a standard 14-week semester
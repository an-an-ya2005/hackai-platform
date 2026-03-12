export class ReviewResponseDto {
  id: string;
  score: number;
  feedback?: string;
  createdAt: Date;
  reviewer: {
    id: string;
    name: string;
    email: string;
  };
  application: {
    id: string;
    title: string;
  };

  constructor(review: any) {
    this.id = review.id;
    this.score = review.score;
    this.feedback = review.feedback;
    this.createdAt = review.createdAt;
    this.reviewer = {
      id: review.reviewer.id,
      name: review.reviewer.name,
      email: review.reviewer.email,
    };
    this.application = {
      id: review.application.id,
      title: review.application.title,
    };
  }
}

import { IsInt, Min, Max, IsOptional, IsString } from 'class-validator';

export class CreateReviewDto {
  @IsInt()
  @Min(1)
  @Max(10)
  score: number;

  @IsOptional()
  @IsString()
  feedback?: string;
}

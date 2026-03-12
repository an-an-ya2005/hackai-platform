import { IsString, IsNotEmpty, IsArray, IsOptional, IsInt, Min, Max, IsUrl, IsEnum } from 'class-validator';

export class CreateApplicationDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsNotEmpty()
  problemStatement: string;

  @IsString()
  @IsNotEmpty()
  solution: string;

  @IsArray()
  @IsString({ each: true })
  techStack: string[];

  @IsInt()
  @Min(1)
  @Max(10)
  teamSize: number;

  @IsArray()
  @IsString({ each: true })
  teamMembers: string[];

  @IsOptional()
  @IsUrl()
  githubRepo?: string;

  @IsOptional()
  @IsUrl()
  demoUrl?: string;

  @IsOptional()
  @IsEnum(['DRAFT', 'SUBMITTED'])
  status?: 'DRAFT' | 'SUBMITTED';
}

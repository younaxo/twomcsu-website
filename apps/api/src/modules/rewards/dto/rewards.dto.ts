import { IsIn, IsInt, IsNumber, Max, Min } from 'class-validator';

export class ClaimCardDto {
  @IsInt()
  @Min(0)
  @Max(7)
  cardIndex: number;
}

export class RouletteDto {
  @IsInt()
  @Min(1)
  @Max(100_000)
  bet: number;

  @IsIn(['RED', 'BLACK', 'GREEN'])
  color: 'RED' | 'BLACK' | 'GREEN';
}

export class CrashDto {
  @IsInt()
  @Min(1)
  @Max(100_000)
  bet: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(1.1)
  @Max(10)
  autoCashout: number;
}

export class UpgraderDto {
  @IsInt()
  @Min(1)
  @Max(100_000)
  bet: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(1.2)
  @Max(10)
  targetMultiplier: number;
}

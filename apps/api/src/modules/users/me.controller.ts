import {
  Body,
  Controller,
  Delete,
  FileTypeValidator,
  Get,
  HttpCode,
  HttpStatus,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  Patch,
  Post,
  Put,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  BannerPreset,
  MediaBadgeRequest,
  MyProfile,
  SocialLink,
  SocialPlatform,
} from '@twomc/shared';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { imageUploadOptions } from '../uploads/multer.options';
import { CreateMediaRequestDto } from './dto/create-media-request.dto';
import { SetBannerPresetDto } from './dto/set-banner-preset.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpsertSocialLinkDto } from './dto/upsert-social-link.dto';
import { UsersService } from './users.service';

@Controller('users/me')
@UseGuards(JwtAuthGuard)
export class MeController {
  constructor(private readonly users: UsersService) {}

  @Get('profile')
  getProfile(@CurrentUser('id') userId: string): Promise<MyProfile> {
    return this.users.getMyProfile(userId);
  }

  @Patch('profile')
  updateProfile(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateProfileDto,
  ): Promise<MyProfile> {
    return this.users.updateMyProfile(userId, dto);
  }

  @Post('avatar')
  @UseInterceptors(FileInterceptor('file', imageUploadOptions(5 * 1024 * 1024)))
  uploadAvatar(
    @CurrentUser('id') userId: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
          new FileTypeValidator({ fileType: /^image\/(jpeg|png|webp|gif)$/ }),
        ],
      }),
    )
    file: Express.Multer.File,
  ): Promise<MyProfile> {
    return this.users.uploadAvatar(userId, file);
  }

  @Delete('avatar')
  deleteAvatar(@CurrentUser('id') userId: string): Promise<MyProfile> {
    return this.users.deleteAvatar(userId);
  }

  @Post('banner')
  @UseInterceptors(FileInterceptor('file', imageUploadOptions(10 * 1024 * 1024)))
  uploadBanner(
    @CurrentUser('id') userId: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }),
          new FileTypeValidator({ fileType: /^image\/(jpeg|png|webp|gif)$/ }),
        ],
      }),
    )
    file: Express.Multer.File,
  ): Promise<MyProfile> {
    return this.users.uploadBanner(userId, file);
  }

  @Delete('banner')
  deleteBanner(@CurrentUser('id') userId: string): Promise<MyProfile> {
    return this.users.deleteBanner(userId);
  }

  @Patch('banner/preset')
  setBannerPreset(
    @CurrentUser('id') userId: string,
    @Body() dto: SetBannerPresetDto,
  ): Promise<MyProfile> {
    return this.users.setBannerPreset(userId, dto);
  }

  @Get('socials')
  listSocials(@CurrentUser('id') userId: string): Promise<SocialLink[]> {
    return this.users.listMySocials(userId);
  }

  @Put('socials/:platform')
  upsertSocial(
    @CurrentUser('id') userId: string,
    @Param('platform') platform: SocialPlatform,
    @Body() dto: UpsertSocialLinkDto,
  ): Promise<SocialLink> {
    return this.users.upsertSocial(userId, { platform, value: dto.value });
  }

  @Delete('socials/:platform')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteSocial(
    @CurrentUser('id') userId: string,
    @Param('platform') platform: string,
  ): Promise<void> {
    return this.users.deleteSocial(userId, platform);
  }

  @Post('media-request')
  @HttpCode(HttpStatus.CREATED)
  createMediaRequest(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateMediaRequestDto,
  ): Promise<MediaBadgeRequest> {
    return this.users.createMediaRequest(userId, dto);
  }

  @Get('media-requests')
  listMediaRequests(@CurrentUser('id') userId: string): Promise<MediaBadgeRequest[]> {
    return this.users.listMyMediaRequests(userId);
  }
}

@Controller('banners')
export class BannersController {
  constructor(private readonly users: UsersService) {}

  @Get('presets')
  listPresets(): Promise<BannerPreset[]> {
    return this.users.listBannerPresets();
  }
}

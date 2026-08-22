import '@angular/compiler';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Injector } from '@angular/core';
import { WishlistService } from './wishlist.service';
import { Http } from '../common/http';
import { of } from 'rxjs';

describe('WishlistService', () => {
  let service: WishlistService;
  let httpMock: {
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    httpMock = {
      get: vi.fn().mockReturnValue(of([])),
      post: vi.fn().mockReturnValue(of({})),
      delete: vi.fn().mockReturnValue(of({})),
    };

    const injector = Injector.create({
      providers: [
        { provide: WishlistService, useClass: WishlistService },
        { provide: Http, useValue: httpMock },
      ],
    });

    service = injector.get(WishlistService);
  });

  it('should call GET /v1/wishlist/{userCd}', () => {
    service.getWishlist(101);
    expect(httpMock.get).toHaveBeenCalledWith(expect.stringContaining('/v1/wishlist/101'));
  });

  it('should call POST /v1/wishlist/save with userCd and productCd', () => {
    service.add(101, 202);
    expect(httpMock.post).toHaveBeenCalledWith(
      expect.stringContaining('/v1/wishlist/save'),
      { userCd: 101, productCd: 202 }
    );
  });

  it('should call DELETE /v1/wishlist/{wishlistCd}', () => {
    service.remove(555);
    expect(httpMock.delete).toHaveBeenCalledWith(expect.stringContaining('/v1/wishlist/555'));
  });
});

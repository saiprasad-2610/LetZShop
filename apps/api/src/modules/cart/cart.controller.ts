import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CartService } from './cart.service';
import { Public } from '../../common/decorators';

@ApiTags('Guest Cart')
@Public()
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Post('init')
  @ApiOperation({ summary: 'Initialize or retrieve guest shopping cart' })
  async initCart(
    @Body('storeId') storeId: string,
    @Body('guestToken') guestToken?: string
  ) {
    return this.cartService.getOrCreateCart(storeId, guestToken);
  }

  @Post(':cartId/items')
  @ApiOperation({ summary: 'Add item to guest cart' })
  async addItem(
    @Param('cartId') cartId: string,
    @Body() body: { variantId: string; quantity: number }
  ) {
    return this.cartService.addItem(cartId, body?.variantId, Number(body?.quantity) || 1);
  }

  @Get(':cartId')
  @ApiOperation({ summary: 'Get current cart items and subtotal' })
  async getCart(@Param('cartId') cartId: string) {
    return this.cartService.getCart(cartId);
  }

  @Post(':cartId/items/:variantId')
  @ApiOperation({ summary: 'Update cart item quantity' })
  async updateQuantity(
    @Param('cartId') cartId: string,
    @Param('variantId') variantId: string,
    @Body('quantity') quantity: number
  ) {
    return this.cartService.updateItemQuantity(cartId, variantId, Number(quantity));
  }

  @Patch(':cartId/items/:variantId')
  @ApiOperation({ summary: 'Patch cart item quantity' })
  async patchQuantity(
    @Param('cartId') cartId: string,
    @Param('variantId') variantId: string,
    @Body('quantity') quantity: number
  ) {
    return this.cartService.updateItemQuantity(cartId, variantId, Number(quantity));
  }

  @Post(':cartId/items/:variantId/remove')
  @ApiOperation({ summary: 'Remove item from cart via POST' })
  async removeItem(
    @Param('cartId') cartId: string,
    @Param('variantId') variantId: string
  ) {
    return this.cartService.removeItem(cartId, variantId);
  }

  @Delete(':cartId/items/:variantId')
  @ApiOperation({ summary: 'Remove item from cart via DELETE' })
  async deleteItem(
    @Param('cartId') cartId: string,
    @Param('variantId') variantId: string
  ) {
    return this.cartService.removeItem(cartId, variantId);
  }
}


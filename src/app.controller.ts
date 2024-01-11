import { Controller, Get, Render, Param, Session, Res } from '@nestjs/common';
import { Response } from 'express';
import * as mysql from 'mysql2';
import { AppService } from './app.service';
import { termek } from './termekek'; 
import { RowDataPacket } from 'mysql2';

const conn = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || 'elemek',
}).promise();

@Controller()
export class AppController {
  private async loadProducts(): Promise<termek[]> {
    try {
      const [data, fields] = await conn.query('SELECT * FROM termekek');
      const products = Array.from(data as termek[]);
      return products;
    } catch (error) {
      console.error('Error loading products from database:', error);
    }
  }

  @Get()
  @Render('index')
  async index(@Session() session: Record<string, any>) {
    const products = await this.loadProducts();
    const cart = session?.cart || []; 
    const totalValue = this.calculateTotalValue(products, cart);
    return { message: 'Welcome to the homepage', products: products, cart, totalValue };
  }

  private calculateTotalValue(products: termek[], cart: number[]): number {
    return cart.reduce((sum, cartProd) => sum + products[products.findIndex(termek => termek.id == cartProd)].ar, 0);
  }

  @Get('/cart/add/:id')
  addToCart(
    @Param('id') id: string, 
    @Session() session: Record<string, any>,
    @Res() res: Response
    ) {
    const productId = parseInt(id, 10);

    if (!session.cart) {
      session.cart = []; 
    }

    if (!session.cart.includes(productId)) {
     
      session.cart.push(productId);
    }
    res.redirect('/');
  }
}

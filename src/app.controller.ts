import { Controller, Get, Render, Param, Session } from '@nestjs/common';
import * as mysql from 'mysql2';
import { AppService } from './app.service';
import { termek } from './termekek'; 
import { RowDataPacket } from 'mysql2';

const conn = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || 'termekek',
}).promise();

@Controller()
export class AppController {
  private cart: number[] = []; 
  private products: termek[] = []; 

  constructor(private readonly appService: AppService) {
    this.loadProducts();
  }

  private async loadProducts() {
    try {
      const [rows] = await conn.query<RowDataPacket[]>('SELECT * FROM termek_adatok');
      this.products = rows.map((row: any) => Object.assign(new termek(), row));
    } catch (error) {
      console.error('Error loading products from database:', error);
    }
  }

  @Get()
  @Render('index')
  index(@Session() session: Record<string, any>) {
    const totalValue = this.calculateTotalValue();
    const cart = session?.cart || []; 
    return { message: 'Welcome to the homepage', products: this.products, cart, totalValue };
  }

  private calculateTotalValue(): number {
    return this.cart.reduce((total, productId) => {
      const product = this.products.find(p => p.id === productId);
      return total + (product ? product.ar : 0);
    }, 0);
  }

  @Get('/cart/add/:id')
  addToCart(@Param('id') id: string, @Session() session: Record<string, any>) {
    const productId = parseInt(id, 10);

    if (!session.cart) {
      session.cart = []; 
    }

    if (!session.cart.includes(productId)) {
     
      session.cart.push(productId);
    }
    return { message: `Product with ID ${productId} added to the cart` };
  }
}

import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
import * as fs from 'fs/promises'
import * as path from 'path'
const puppeteer = require('puppeteer')

@Injectable()
export class UpdateCookiesService implements OnModuleInit {
  private readonly logger = new Logger(UpdateCookiesService.name);
  private readonly cookiesFilePath = path.join(process.cwd(), 'cookies.txt');

  // YouTube login ma'lumotlari - muhit o'zgaruvchilaridan oling
  private readonly email = process.env.YOUTUBE_EMAIL;
  private readonly password = process.env.YOUTUBE_PASSWORD;

  async onModuleInit() {
    this.logger.log('Cookie yangilash servisi ishga tushdi')
    // Dastur ishga tushganda bir marta cookies yangilanadi
    await this.updateCookies()
  }

  @Cron('0 */2 * * *') // Har 2 soatda bir marta
  async updateCookiesScheduled() {
    this.logger.log('Rejalashtirilgan cookie yangilash boshlandi')
    await this.updateCookies()
  }

  async updateCookies(): Promise<void> {
    let browser: any = null

    try {
      this.logger.log('YouTube ga ulanish va cookie olish boshlandi')

      if (!this.email || !this.password) {
        throw new Error('YouTube login ma\'lumotlari topilmadi. YOUTUBE_EMAIL va YOUTUBE_PASSWORD muhit o\'zgaruvchilarini o\'rnating.')
      }

      // Puppeteer browser ochish
      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu'
        ]
      })

      const page = await browser.newPage()

      // User agent o'rnatish
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')

      // YouTube login sahifasiga o'tish
      await page.goto('https://accounts.google.com/signin', { waitUntil: 'networkidle2' })

      // Email kiritish
      await page.waitForSelector('#identifierId', { timeout: 10000 })
      await page.type('#identifierId', this.email)
      await page.click('#identifierNext')

      // Parol sahifasini kutish
      await page.waitForSelector('input[name="password"]', { timeout: 10000 })
      await page.type('input[name="password"]', this.password)
      await page.click('#passwordNext')

      // Login tugashini kutish
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 })

      // YouTube ga o'tish
      await page.goto('https://www.youtube.com', { waitUntil: 'networkidle2' })

      // Cookielarni olish
      const cookies = await page.cookies()

      // Cookies.txt formatida saqlash
      const cookieString = cookies
        .map(cookie => {
          return [
            cookie.domain,
            'TRUE',
            cookie.path,
            cookie.secure ? 'TRUE' : 'FALSE',
            cookie.expires ? Math.floor(cookie.expires) : '0',
            cookie.name,
            cookie.value
          ].join('\t')
        })
        .join('\n')

      // Faylga yozish
      const finalContent = `# Netscape HTTP Cookie File\n# This is a generated file! Do not edit.\n\n${cookieString}`
      await fs.writeFile(this.cookiesFilePath, finalContent, 'utf8')

      this.logger.log(`Cookies muvaffaqiyatli yangilandi: ${cookies.length} ta cookie saqlandi`)

    } catch (error) {
      this.logger.error('Cookie yangilashda xatolik:', error.message)
      throw error
    } finally {
      if (browser) {
        await browser.close()
      }
    }
  }

  // Manual cookie yangilash uchun
  async manualUpdate(): Promise<{ success: boolean; message: string }> {
    try {
      await this.updateCookies()
      return { success: true, message: 'Cookies muvaffaqiyatli yangilandi' }
    } catch (error) {
      return { success: false, message: `Xatolik: ${error.message}` }
    }
  }

  // Joriy cookielarni o'qish
  async getCurrentCookies(): Promise<string> {
    try {
      const content = await fs.readFile(this.cookiesFilePath, 'utf8')
      return content
    } catch (error) {
      this.logger.warn('Cookies fayli o\'qilmadi:', error.message)
      return ''
    }
  }

  // Cookie fayli mavjudligini tekshirish
  async checkCookieFile(): Promise<boolean> {
    try {
      await fs.access(this.cookiesFilePath)
      return true
    } catch {
      return false
    }
  }
}
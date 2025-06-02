import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
import * as fs from 'fs/promises'
import * as path from 'path'
import * as puppeteer from 'puppeteer'

@Injectable()
export class UpdateCookiesService implements OnModuleInit {
  private readonly logger = new Logger(UpdateCookiesService.name);
  private readonly cookiesFilePath = path.join(process.cwd(), 'cookies.txt');

  private readonly email = process.env.YOUTUBE_EMAIL;
  private readonly password = process.env.YOUTUBE_PASSWORD;

  async onModuleInit() {
    this.logger.log('Cookie yangilash servisi ishga tushdi')
    await this.updateCookies()
  }

  @Cron('0 */2 * * *')
  async updateCookiesScheduled() {
    this.logger.log('Rejalashtirilgan cookie yangilash boshlandi')
    await this.updateCookies()
  }

  async updateCookies(): Promise<void> {
    let browser: puppeteer.Browser | null = null

    try {
      this.logger.log('YouTube ga ulanish va cookie olish boshlandi')

      if (!this.email || !this.password) {
        throw new Error('YouTube login ma\'lumotlari topilmadi. YOUTUBE_EMAIL va YOUTUBE_PASSWORD muhit o\'zgaruvchilarini o\'rnating.')
      }

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

      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')

      await page.goto('https://accounts.google.com/signin', { waitUntil: 'networkidle2' })

      await page.waitForSelector('#identifierId', { timeout: 10000 })
      await page.type('#identifierId', this.email)
      await page.click('#identifierNext')

      await page.waitForSelector('input[name="password"]', { timeout: 10000 })
      await page.type('input[name="password"]', this.password)
      await page.click('#passwordNext')

      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 })

      await page.goto('https://www.youtube.com', { waitUntil: 'networkidle2' })

      const cookies = await page.cookies()

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

  async manualUpdate(): Promise<{ success: boolean; message: string }> {
    try {
      await this.updateCookies()
      return { success: true, message: 'Cookies muvaffaqiyatli yangilandi' }
    } catch (error) {
      return { success: false, message: `Xatolik: ${error.message}` }
    }
  }

  async getCurrentCookies(): Promise<string> {
    try {
      const content = await fs.readFile(this.cookiesFilePath, 'utf8')
      return content
    } catch (error) {
      this.logger.warn('Cookies fayli o\'qilmadi:', error.message)
      return ''
    }
  }

  async checkCookieFile(): Promise<boolean> {
    try {
      await fs.access(this.cookiesFilePath)
      return true
    } catch {
      return false
    }
  }
}
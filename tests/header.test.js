const puppeteer = require('puppeteer')

let browser, page

beforeEach(async () => {
    browser = await puppeteer.launch({
        // headless: false === com interface grafica
        headless: true,
        // --no-sandbox diminui o tempo de execucao dos testes
        args: ['--no-sandbox']
    })
    // criando uma tab no novagador
    page = await browser.newPage()
    await page.goto('http://localhost:3000')
})

afterEach(async () => {
    await browser.close()
})

test('Validando o texto do header', async () => {
    // pegar o texto do link principal do blog
    // esse trecho (el => el.innerHTML) é transmitido para o navegador como texto
    // o navegador interpreta e retorna como texto tb
    const text = await page.$eval('a.brand-logo', el => el.innerHTML)
    expect(text).toEqual('Blogster')
})

test('Clicando no login e iniciando o fluxo oauth', async () => {
    await page.click('.right a')
    // verificando se a pagina esta no dominio do google
    const url = await page.url()
    expect(url).toMatch(/accounts\.google\.com/)
})

test('Logando e mostrando botao de loggout', async () => {
    // _id do mongo
    const id = '5f05009a1e3fe3136096b468'
    const Buffer = require('safe-buffer').Buffer
    const sessionObject = {
        passport: {
            user: id
        }
    }
    const sessionString = Buffer.from(JSON.stringify(sessionObject)).toString('base64')
    const Keygrip = require('keygrip')
    const keys = require('../config/keys')
    const keygrip = new Keygrip([keys.cookieKey])
    const sig = keygrip.sign('session=' + sessionString)

    await page.setCookie({ name: 'session', value: sessionString })
    await page.setCookie({ name: 'session.sig', value: sig })
    // refresh the page to simulate the login
    await page.goto('http://localhost:3000')

    await page.waitFor('a[href="/auth/logout"]')
    const text = await page.$eval('a[href="/auth/logout"]', el => el.innerHTML)
    expect(text).toEqual('Logout')
})


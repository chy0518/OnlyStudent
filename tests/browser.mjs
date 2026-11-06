import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1050}});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
try {
 await page.goto('http://localhost:5173');
 await page.getByRole('button',{name:'进入学习空间'}).click();
 await page.getByRole('heading',{name:'陈同学，今天也一起进步吧'}).waitFor();
 await page.screenshot({path:'tests/home-desktop.png',fullPage:true});
 await page.locator('nav a[href="/classes"]').click();
 await page.getByRole('heading',{name:'高一数学 · 秋季进阶班'}).click();
 await page.getByRole('heading',{name:'热身练习：函数求值'}).waitFor();
 await page.locator('input[type=radio][value="7"]').check();
 await page.locator('section.activity').filter({has:page.getByRole('heading',{name:'热身练习：函数求值'})}).getByRole('button',{name:/提交答案|更新提交/}).click();
 await page.getByText('回答正确，继续保持！').waitFor();
 await page.getByRole('button',{name:'退出登录'}).click();
 await page.locator('input[name=username]').fill('teacher');
 await page.getByRole('button',{name:'进入学习空间'}).click();
 await page.locator('nav a[href="/classes"]').click();
 await page.getByRole('heading',{name:'高一数学 · 秋季进阶班'}).click();
 await page.getByRole('button',{name:'学生名单'}).click();
 await page.getByText('陈同学',{exact:true}).waitFor();
 await page.setViewportSize({width:390,height:844});
 await page.screenshot({path:'tests/class-mobile.png',fullPage:true});
 assert.deepEqual(errors,[]);
 console.log('PASS: student login, homepage, class quiz, teacher roster, mobile view; no browser exceptions');
}catch(e){console.error(await page.locator('body').innerText());await page.screenshot({path:'tests/browser-failure.png',fullPage:true});throw e;}finally{await browser.close();}

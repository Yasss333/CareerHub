import test from 'node:test';
import assert from 'node:assert/strict';
import puppeteer from 'puppeteer';

test('feedback header/dialog fit narrow screens and keyboard dismissal restores focus', {timeout:60000}, async()=>{
 const browser=await puppeteer.launch({headless:true,executablePath:'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'});
 try{
  const page=await browser.newPage();
  await page.evaluateOnNewDocument(()=>{localStorage.setItem('token','isolated-layout-fixture');localStorage.setItem('user',JSON.stringify({id:'fixture',role:'USER',name:'Layout test'}));});
  await page.setRequestInterception(true);page.on('request',request=>new URL(request.url()).pathname.startsWith('/api/')?request.respond({status:200,contentType:'application/json',body:JSON.stringify(new URL(request.url()).pathname.startsWith('/api/feedback')?{reports:[],nextCursor:null}:[])}):request.continue());
  await page.goto('http://127.0.0.1:5173/feedback',{waitUntil:'networkidle0'});
  for(const width of [320,390,768,1440]){await page.setViewport({width,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`page fits ${width}px`);}
  await page.setViewport({width:320,height:844});await page.click('button[aria-label="Report a bug"]');await page.waitForSelector('[role="dialog"]',{visible:true});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  assert.equal(await page.evaluate(()=>document.querySelector('[role="dialog"]').contains(document.activeElement)),true);
  await page.keyboard.press('Escape');await page.waitForSelector('[role="dialog"]',{hidden:true});
  assert.equal(await page.evaluate(()=>document.activeElement?.getAttribute('aria-label')),'Report a bug');
 }finally{await browser.close();}
});

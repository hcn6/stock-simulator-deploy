import numpy as np
import pandas as pd
import scrapy
from time import time
import pdb
import random
from . import current_stocks
import pymongo
class StockSpider(scrapy.Spider):
  companyList = current_stocks.get_all()
  name = "stock"
  start_urls = ['https://finance.yahoo.com/quote/']
  db = pymongo.MongoClient('mongodb://localhost:27017')["StockApp"]["StockPrice"]
  def parse(self, response):
    for company in self.companyList:
        link = self.start_urls[0] + company + '/'
        print(link)
        yield scrapy.Request(link, callback = self.crawlStock, meta = {'companyName' : company})
  def crawlStock(self, response): 
      companyName = response.meta.get('companyName')
      price = response.xpath('//*[@id="quote-header-info"]/div[3]/div[1]/div/span/text()').extract()[0]
      growth = response.xpath('//*[@id="quote-header-info"]/div[3]/div[1]/div/span/text()').extract()[1]
      json = {
        "stock": companyName,
        "time": int(time()) * 1000000000,
        "fields": {
          "price": str(price),
          "growth": str((growth))
        }
      }
      if self.db.find_one_and_update({"stock": companyName}, {"$set": json}) == None:
        self.db.insert_one(json)
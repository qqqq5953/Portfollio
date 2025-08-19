pending:

## stock detail page
1. 總覽卡片區
這裡是「一眼看全局」，顯示「持倉狀況」和「已賣出績效總結」。
- 當持倉 > 0
  - 上半部顯示未實現部位的 Profit, Profit%, Shares, Average Cost, Market Value。
  - 下半部（小卡片或次要區）顯示已實現損益總額（例如「歷史已賣出累計盈虧：+1,200」）。
- 當持倉 = 0
  - 直接用大卡片顯示這個標的「最後一次完整交易周期的最終結果」：
  ```
  已實現總盈虧：+1,240
  總投入：25,000
  報酬率：+4.96%
  交易期間：2023-03-01 ~ 2023-06-15
  ```
  - 讓頁面在清倉時依然有數據可看，不會變成空白。

2. 交易紀錄區（Tabs）
我會改成這種結構：
- All（全部） → 買進與賣出交易都顯示，可按日期或類型排序
- Buy（買進） → 僅顯示買進紀錄
- Sell（賣出） → 僅顯示賣出紀錄，並且在該 tab 頂部放一張卡片顯示「累計已實現盈虧」
  - 卡片數據示例：
  ```
  累計已實現盈虧：+1,240
  平均報酬率：+4.96%
  總賣出股數：500 股
  交易次數：8
  ```
  - 這樣使用者在「賣出 tab」不用翻表格就能先看到總體績效。

3. 分析區（可選進階功能）
這裡可以用更可視化的方式呈現賣出獲利資訊，例如：
- 已實現盈虧的時間分布圖（按月份）
- 每次賣出的盈虧對比圖
- 累計報酬率曲線

## overview page
- 新增一個共用的 function，取得單一個股尚未賣出的交易，可用於 stock detail page。另外於 unrealized-stock-read api 中也可以用這個 function 透過迴圈方式獲得所有個股的未實現損益
- 手機版 unrealized stock 還沒設計

## performance page
- 折現圖用 money weighted return 計算即可，將每個交易日 sum(每個個股的股數*當天收盤價)，得到當日的資產總值

## 建立共用元件
- format number 元件顯示漲跌（+, -）、需不需要%
- 整理 edge function，將共用的部份抽出來

## add logo
<img src="https://api.elbstream.com/logos/symbol/AAPL" />
<a href="https://elbstream.com">Logos provided by Elbstream</a>
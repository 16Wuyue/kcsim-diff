# kcsim-diff

比對兩份[艦隊これくしょん 出撃シミュレータ](https://kc3kai.github.io/kancolle-replay/simulator.html)設定的差異：編成、艦娘素質、裝備、基地航空隊、敵方設定、模擬器設定。

**→ 直接使用：https://16wuyue.github.io/kcsim-diff/**

## 用法

貼入兩條共享連結後按「比對設定」。支援三種輸入：

| 形態 | 範例 |
|---|---|
| 共享短連結 | `https://kc3kai.github.io/kancolle-replay/?s=xxxxxxxxxxx` |
| 完整備份連結 | `https://kc3kai.github.io/kancolle-replay/simulator.html#backup=...` |
| 備份檔 | `KanColle_Sortie_Simulator_Backup_*.kcsim` |

比對完成後，網址會變成 `?a=<id>&b=<id>`，可直接分享或加書籤——右上角有「複製」按鈕。備份檔或長連結因為資料量太大無法塞進網址，此時不會產生比對連結。

介面支援中文 / 日本語 / English，深色與淺色主題，選擇會記在瀏覽器。

## 這個工具不做什麼

**不執行模擬，也不判斷任何差異的影響大小。** 它只列出存檔中可觀察到的事實：A 是什麼、B 是什麼。要知道差異對勝率的影響，請用模擬器本身跑。

另外，模擬器裡的「自動調整 HP/回避/対潜/索敵 with レベル」與「艦の変更時に特効を維持」是編輯輔助設定，不會寫進存檔，因此無法比對——它們造成的最終數值差異仍會正常顯示。

## 資料來源與致謝

本工具**不重製**任何遊戲資料或模擬器程式碼，全部在執行時向來源取用：

- 艦娘與裝備的名稱、圖示、素質圖示、陣形與節點圖：[KC3Kai/kancolle-replay](https://github.com/KC3Kai/kancolle-replay) 的 `kcSHIPDATA.js` / `kcEQDATA.js` / `assets/`
- 介面用語：同專案的 `strings_en.json` / `strings_ja.json`
- 共享短連結的還原：[kcrdb.hitomaru.dev](https://kcrdb.hitomaru.dev)

上述素材透過 [jsDelivr](https://www.jsdelivr.com/) 的 GitHub 端點取用（`cdn.jsdelivr.net/gh/KC3Kai/kancolle-replay@master/...`），而不是直接連 KC3Kai 的 GitHub Pages——這樣不會佔用他們的頻寬配額。用 `@master` 是為了讓上游新增的艦娘與裝備自動跟上。

kancolle-replay 以 MIT 授權釋出：

```
Copyright (c) 2016 fourinone41
Licensed under the MIT License
https://github.com/KC3Kai/kancolle-replay/blob/master/LICENSE
```

MIT 涵蓋的是該專案的**程式與資料檔**。`assets/` 底下的艦娘立繪與裝備圖示屬於艦隊これくしょん的遊戲美術，版權為 DMM GAMES / KADOKAWA 所有，不在 MIT 的授權範圍內。

本專案為非官方的第三方工具，與 KC3Kai、DMM GAMES、KADOKAWA 均無關聯，亦未受其背書。

## 隱私

所有解析與比對都在瀏覽器內完成，沒有後端、沒有追蹤、沒有 cookie。你的設定資料只會送往兩個地方：kcrdb（為了還原你自己貼上的共享連結）與 kc3kai.github.io（為了取用圖片與名稱資料）。

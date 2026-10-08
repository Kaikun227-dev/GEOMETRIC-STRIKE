'use strict';
// Canvas・共通定数・基本ユーティリティ
// index.html の defer スクリプト順で読み込む。共有する定義は README.md を参照。

  const canvas = document.getElementById('arena');
  if (!canvas) throw new Error('Game canvas #arena is missing');
  const ctx = canvas.getContext('2d');
  const WIDTH = 620;
  const HEIGHT = 740;
  const FIELD = { left: 28, right: 592, top: 28, bottom: 712 };
  const TAU = Math.PI * 2;
  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
  const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const $ = id => document.getElementById(id);
  const pad2 = n => String(n).padStart(2, '0');
  const fmt = n => Math.round(n).toLocaleString('en-US');

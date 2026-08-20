# 音乐目录（music）

这里存放博客右下角悬浮音乐播放器要播放的本地音乐。每首歌一个独立目录。

## 1. 添加第一首歌

在 `static/music/` 下新建一个目录，放进音频、可选封面和元数据：

```
static/music/晴-天/
├── music.mp3      # 音频（必需）
├── cover.webp     # 封面（可选，不填用占位封面）
└── info.json      # 元数据（可选）
```

## 2. info.json 格式

```json
{
  "title": "晴天",
  "artist": "周杰伦",
  "album": "叶惠美",
  "order": 1
}
```

- `title`：歌曲名（缺省用目录名）
- `artist`：歌手（缺省显示 Unknown Artist）
- `album`：专辑（可选）
- `order`：排序数字（可选，从小到大，没 order 的排最后）

## 3. 支持的格式

- 音频：`mp3` `m4a` `ogg` `wav` `flac`
- 封面：`jpg` `jpeg` `png` `webp` `avif`

同一目录有多个音频/封面时，优先选 `music.*` 和 `cover.*`，否则选第一个并在控制台给出警告。

## 4. 运行同步脚本

放好音乐后，在项目根目录执行：

```bash
python scripts/sync_music.py
```

它会扫描 `static/music/` 并生成 `data/music/generated.json`（这个文件要提交进 Git，GitHub Actions 不需要 Python）。

## 5. 本地预览

```bash
hugo server -D
```

浏览器打开 `http://localhost:1313`，右下角即可看到播放器。

## 6. 检查生成的歌单

```bash
python -m json.tool data/music/generated.json
```

## 7. 添加歌曲后需要提交的文件

- `static/music/你的歌曲目录/`（音频、封面、info.json）
- `data/music/generated.json`

## 注意事项

- 不要提交 Cookie、访问令牌、私钥等隐私信息
- 仅上传自己有权公开发布的音频，不要提交未授权音乐
- `example-track/` 是示例目录，同步脚本会自动忽略

#!/usr/bin/env python3
from pathlib import Path
import subprocess
import shutil

ROOT = Path('frontend/public/media/avatars/evolutions/sac_magnesie')
TMP = Path('/tmp/climbcrew-sac-magnesie-svg')
TMP.mkdir(parents=True, exist_ok=True)

VARIANTS = {
    'homme': {
        'accent': '#e69a22',
        'accent2': '#1f8f9d',
        'eye': '#143a52',
        'lash': False,
        'smile': 'M 218 284 Q 256 318 294 284',
        'brow_left': 'M 205 225 Q 220 214 236 220',
        'brow_right': 'M 276 220 Q 292 214 307 225',
    },
    'femme': {
        'accent': '#2c9a8f',
        'accent2': '#d8893d',
        'eye': '#143a52',
        'lash': True,
        'smile': 'M 218 284 Q 256 316 294 284',
        'brow_left': 'M 204 224 Q 220 212 237 219',
        'brow_right': 'M 275 219 Q 292 212 308 224',
    },
}

LEVELS = {
    1: dict(scale=.82, y=26, pose='wave', gear=0, rope=False, chalk=False, headband=False, glasses=False, patch='dot'),
    2: dict(scale=.86, y=22, pose='walk', gear=1, rope=False, chalk=False, headband=False, glasses=False, patch='stripe'),
    3: dict(scale=.90, y=16, pose='thumb', gear=2, rope=False, chalk=False, headband=False, glasses=False, patch='chevron'),
    4: dict(scale=.94, y=10, pose='cross', gear=3, rope=True, chalk=False, headband=False, glasses=False, patch='chevron'),
    5: dict(scale=.98, y=4, pose='chalk', gear=4, rope=True, chalk=True, headband=False, glasses=False, patch='bolt'),
    6: dict(scale=1.00, y=0, pose='point', gear=5, rope=True, chalk=True, headband=False, glasses=False, patch='bolt'),
    7: dict(scale=1.02, y=-2, pose='strong', gear=6, rope=True, chalk=True, headband=True, glasses=False, patch='bolt'),
    8: dict(scale=1.04, y=-4, pose='elite', gear=7, rope=True, chalk=True, headband=True, glasses=True, patch='crown'),
}


def arm_svg(pose, accent):
    common = "stroke='#d99a72' stroke-width='24' stroke-linecap='round' fill='none'"
    glove = f"fill='{accent}' stroke='#202833' stroke-width='5'"
    if pose == 'wave':
        return f"<path d='M184 280 Q130 260 118 205' {common}/><circle cx='114' cy='192' r='18' {glove}/><path d='M328 282 Q365 300 382 327' {common}/><circle cx='389' cy='337' r='17' {glove}/>"
    if pose == 'walk':
        return f"<path d='M184 280 Q145 250 135 220' {common}/><circle cx='132' cy='208' r='17' {glove}/><path d='M328 282 Q366 268 392 238' {common}/><circle cx='399' cy='228' r='17' {glove}/>"
    if pose == 'thumb':
        return f"<path d='M184 280 Q146 244 137 213' {common}/><g transform='translate(128 188)'><rect x='0' y='12' width='28' height='30' rx='10' {glove}/><rect x='9' y='-10' width='10' height='27' rx='5' {glove}/></g><path d='M328 282 Q365 292 389 320' {common}/><circle cx='395' cy='330' r='17' {glove}/>"
    if pose == 'cross':
        return f"<path d='M184 285 Q225 315 274 297' {common}/><path d='M328 285 Q287 315 238 297' {common}/><circle cx='278' cy='298' r='16' {glove}/><circle cx='234' cy='298' r='16' {glove}/>"
    if pose == 'chalk':
        return f"<path d='M184 276 Q143 248 132 210' {common}/><circle cx='129' cy='198' r='18' fill='#f4f3ef' stroke='#202833' stroke-width='5'/><path d='M328 282 Q368 296 391 327' {common}/><circle cx='397' cy='337' r='17' {glove}/>"
    if pose == 'point':
        return f"<path d='M184 280 Q145 250 137 220' {common}/><g transform='translate(127 185)'><rect x='0' y='18' width='28' height='30' rx='10' {glove}/><rect x='10' y='-18' width='9' height='38' rx='5' {glove}/></g><path d='M328 282 Q366 300 392 327' {common}/><circle cx='399' cy='338' r='17' {glove}/>"
    if pose in ('strong', 'elite'):
        return f"<path d='M184 278 Q145 245 137 211' {common}/><g transform='translate(126 180)'><rect x='0' y='18' width='28' height='30' rx='10' {glove}/><rect x='10' y='-18' width='9' height='38' rx='5' {glove}/></g><path d='M328 278 Q367 245 375 211' {common}/><g transform='translate(365 180)'><rect x='0' y='18' width='28' height='30' rx='10' {glove}/><rect x='10' y='-18' width='9' height='38' rx='5' {glove}/></g>"
    return ''


def legs_svg(level, accent):
    # Progressively firmer stance / better shoes.
    if level <= 2:
        return f"<path d='M220 375 Q205 415 184 438' stroke='#d99a72' stroke-width='25' stroke-linecap='round'/><path d='M292 375 Q307 415 332 438' stroke='#d99a72' stroke-width='25' stroke-linecap='round'/><ellipse cx='176' cy='445' rx='33' ry='17' fill='#27313d' transform='rotate(-12 176 445)'/><ellipse cx='340' cy='445' rx='33' ry='17' fill='#27313d' transform='rotate(12 340 445)'/><path d='M151 443 l47 0' stroke='{accent}' stroke-width='7'/><path d='M317 443 l47 0' stroke='{accent}' stroke-width='7'/>"
    return f"<path d='M220 375 Q207 410 191 435' stroke='#d99a72' stroke-width='27' stroke-linecap='round'/><path d='M292 375 Q305 410 321 435' stroke='#d99a72' stroke-width='27' stroke-linecap='round'/><path d='M160 430 Q190 416 215 440 Q190 462 154 450 Z' fill='#202833' stroke='#10151b' stroke-width='5'/><path d='M352 430 Q322 416 297 440 Q322 462 358 450 Z' fill='#202833' stroke='#10151b' stroke-width='5'/><path d='M161 441 l43 -10' stroke='{accent}' stroke-width='7'/><path d='M351 441 l-43 -10' stroke='{accent}' stroke-width='7'/>"


def gear_svg(level, accent, accent2, rope):
    bits = []
    if level >= 3:
        bits.append("<path d='M188 344 Q256 368 324 344' fill='none' stroke='#202833' stroke-width='17' stroke-linecap='round'/>")
        bits.append(f"<rect x='240' y='344' width='32' height='20' rx='5' fill='{accent}' stroke='#202833' stroke-width='4'/>")
    carabiners = min(max(level - 1, 0), 4)
    coords = [(176,330),(336,330),(165,352),(347,352)]
    for i in range(carabiners):
        x,y = coords[i]
        bits.append(f"<g transform='translate({x} {y}) rotate({-18 if i%2==0 else 18})'><ellipse cx='0' cy='0' rx='11' ry='18' fill='none' stroke='{accent2}' stroke-width='6'/><path d='M-5 -13 L7 11' stroke='#202833' stroke-width='3'/></g>")
    if rope:
        bits.append(f"<path d='M329 356 C389 350 412 390 377 420 C348 444 311 431 315 404' fill='none' stroke='{accent}' stroke-width='10' stroke-linecap='round'/>")
    if level >= 6:
        bits.append("<rect x='190' y='352' width='20' height='37' rx='7' fill='#c7ccd1' stroke='#202833' stroke-width='4'/>")
    return ''.join(bits)


def patch_svg(kind, accent):
    if kind == 'dot':
        return f"<circle cx='257' cy='330' r='8' fill='{accent}'/>"
    if kind == 'stripe':
        return f"<path d='M232 328 L280 328' stroke='{accent}' stroke-width='9' stroke-linecap='round'/>"
    if kind == 'chevron':
        return f"<path d='M234 322 L256 340 L278 322' fill='none' stroke='{accent}' stroke-width='9' stroke-linejoin='round'/>"
    if kind == 'bolt':
        return f"<path d='M263 305 L239 334 L255 334 L247 357 L279 323 L261 323 Z' fill='{accent}' stroke='#202833' stroke-width='3'/>"
    if kind == 'crown':
        return f"<path d='M230 342 L237 315 L251 328 L264 311 L277 328 L289 315 L296 342 Z' fill='{accent}' stroke='#202833' stroke-width='4'/><rect x='232' y='340' width='62' height='10' rx='4' fill='{accent}' stroke='#202833' stroke-width='3'/>"
    return ''


def chalk_svg(enabled):
    if not enabled:
        return ''
    return "<g opacity='.58' fill='#f4f3ef'><circle cx='112' cy='171' r='18'/><circle cx='93' cy='151' r='13'/><circle cx='126' cy='145' r='11'/><circle cx='102' cy='128' r='8'/></g>"


def headband_svg(enabled, accent):
    if not enabled:
        return ''
    return f"<path d='M194 155 Q256 137 318 155' fill='none' stroke='{accent}' stroke-width='14' stroke-linecap='round'/><path d='M305 155 l28 18' stroke='{accent}' stroke-width='10' stroke-linecap='round'/>"


def glasses_svg(enabled):
    if not enabled:
        return ''
    return "<g fill='#1b242c' stroke='#080b0e' stroke-width='5'><path d='M197 232 Q218 216 243 228 Q245 254 220 260 Q198 255 197 232 Z'/><path d='M269 228 Q294 216 315 232 Q314 255 292 260 Q267 254 269 228 Z'/><path d='M242 232 Q256 225 270 232' fill='none'/></g>"


def lashes_svg(enabled):
    if not enabled:
        return ''
    return "<path d='M205 236 l-10 -8 M209 231 l-4 -12 M307 236 l10 -8 M303 231 l4 -12' stroke='#202833' stroke-width='4' stroke-linecap='round'/>"


def svg(level, sex, opts, cfg):
    accent, accent2 = cfg['accent'], cfg['accent2']
    scale, y = opts['scale'], opts['y']
    xshift = 256 * (1 - scale)
    yshift = y + 256 * (1 - scale)
    return f"""<svg xmlns='http://www.w3.org/2000/svg' width='512' height='512' viewBox='0 0 512 512'>
<rect width='512' height='512' rx='34' fill='#ffffff'/>
<ellipse cx='256' cy='462' rx='{120 + level*3}' ry='20' fill='#dfe7ea' opacity='.72'/>
<g transform='translate({xshift:.1f} {yshift:.1f}) scale({scale})'>
  {chalk_svg(opts['chalk'])}
  {legs_svg(level, accent)}
  {arm_svg(opts['pose'], accent)}
  <path d='M177 169 Q256 135 335 169 L322 353 Q256 389 190 353 Z' fill='#2f6085' stroke='#202833' stroke-width='7'/>
  <path d='M187 181 Q256 153 325 181' fill='none' stroke='#4d7d9e' stroke-width='8' opacity='.7'/>
  <path d='M182 169 Q256 139 330 169 L318 191 Q256 174 194 191 Z' fill='#1d2833' stroke='#11171d' stroke-width='6'/>
  <ellipse cx='256' cy='171' rx='68' ry='19' fill='#10161c'/>
  <ellipse cx='256' cy='171' rx='56' ry='12' fill='#48525b'/>
  <path d='M323 178 q22 10 23 31' fill='none' stroke='#202833' stroke-width='8' stroke-linecap='round'/>
  <circle cx='215' cy='244' r='28' fill='#f7fbff' stroke='#202833' stroke-width='5'/>
  <circle cx='297' cy='244' r='28' fill='#f7fbff' stroke='#202833' stroke-width='5'/>
  <circle cx='220' cy='247' r='12' fill='{cfg['eye']}'/><circle cx='292' cy='247' r='12' fill='{cfg['eye']}'/>
  <circle cx='224' cy='242' r='4' fill='white'/><circle cx='296' cy='242' r='4' fill='white'/>
  <path d='{cfg['brow_left']}' fill='none' stroke='#202833' stroke-width='7' stroke-linecap='round'/>
  <path d='{cfg['brow_right']}' fill='none' stroke='#202833' stroke-width='7' stroke-linecap='round'/>
  {lashes_svg(cfg['lash'])}
  <path d='{cfg['smile']}' fill='#8b2b32' stroke='#202833' stroke-width='6' stroke-linecap='round'/>
  <path d='M238 299 Q256 307 274 299' fill='none' stroke='#f6d6ca' stroke-width='7' stroke-linecap='round'/>
  {patch_svg(opts['patch'], accent)}
  {gear_svg(level, accent, accent2, opts['rope'])}
  {headband_svg(opts['headband'], accent2)}
  {glasses_svg(opts['glasses'])}
</g>
</svg>"""


def render_one(level, sex):
    cfg = VARIANTS[sex]
    opts = LEVELS[level]
    svg_path = TMP / f'{sex}-level-{level}.svg'
    svg_path.write_text(svg(level, sex, opts, cfg), encoding='utf-8')
    out_dir = ROOT / sex
    out_dir.mkdir(parents=True, exist_ok=True)
    out = out_dir / f'level-{level}.webp'
    if shutil.which('rsvg-convert'):
        png_path = TMP / f'{sex}-level-{level}.png'
        subprocess.run(['rsvg-convert', '-w', '512', '-h', '512', '-o', str(png_path), str(svg_path)], check=True)
        convert = shutil.which('magick') or shutil.which('convert')
        if not convert:
            raise RuntimeError('ImageMagick est requis pour produire les WebP.')
        subprocess.run([convert, str(png_path), '-strip', '-quality', '86', str(out)], check=True)
    else:
        convert = shutil.which('magick') or shutil.which('convert')
        if not convert:
            raise RuntimeError('ImageMagick est requis pour produire les WebP.')
        subprocess.run([convert, str(svg_path), '-resize', '512x512', '-strip', '-quality', '86', str(out)], check=True)
    if not out.exists() or out.stat().st_size == 0:
        raise RuntimeError(f'Image non générée: {out}')


for sex in VARIANTS:
    for level in LEVELS:
        render_one(level, sex)

print('Série sac_magnesie générée: 16 fichiers WebP distincts.')

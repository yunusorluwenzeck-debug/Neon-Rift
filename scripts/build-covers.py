"""Promotional cover art from the game's existing vector ship, not screenshots."""
from pathlib import Path
import random,cairosvg
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
root=Path(__file__).resolve().parent.parent
out=root/'portal/covers';out.mkdir(exist_ok=True)
font=TTFont(root/'dist/fonts/BarlowCondensed-Bold.ttf');glyphs=font.getGlyphSet();cmap=font.getBestCmap();units=font['head'].unitsPerEm
def title(word,x,y,size,color):
 parts=[];advance=0
 for c in word:
  name=cmap[ord(c)];pen=SVGPathPen(glyphs);glyphs[name].draw(pen)
  parts.append(f'<path transform="translate({advance} 0)" d="{pen.getCommands()}"/>');advance+=glyphs[name].width
 return f'<g fill="{color}" transform="translate({x} {y}) scale({size/units} {-size/units})">'+''.join(parts)+'</g>'
def poly(points,fill,stroke='#8db9c0',width=.014):
 return '<polygon points="'+' '.join(f'{x},{y}' for x,y in points)+f'" fill="{fill}" stroke="{stroke}" stroke-width="{width}"/>'
def ship():
 s=''
 for e in [-.48,0,.48]:
  s+=poly([(e-.15,.6),(e,2.5),(e+.15,.6)],'#7cfbe140','none')
  s+=poly([(e-.06,.65),(e,1.6),(e+.06,.65)],'#b6ffe8','none')
 s+=poly([(0,-1.25),(.22,-.53),(.36,-.33),(.76,.14),(.91,.79),(.43,.57),(.26,.7),(0,.46),(-.26,.7),(-.43,.57),(-.91,.79),(-.76,.14),(-.36,-.33),(-.22,-.53)],'#b7ced3')
 for side in [-1,1]:
  s+=poly([(side*.22,-.53),(side*.4,.05),(side*.91,.79),(side*.43,.57),(side*.26,.7),(side*.18,.06)],'#658a95' if side==-1 else '#365362')
  s+=poly([(side*.39,.03),(side*.7,.21),(side*.78,.58),(side*.46,.4)],'#dce9e6' if side==-1 else '#90b0b6')
  s+=f'<path d="M{side*.53} .18v.3" stroke="#8af6dc" stroke-width=".03"/>'
 s+=poly([(0,-1.25),(.2,-.48),(.15,.43),(0,.58),(-.15,.43),(-.2,-.48)],'#eff6ef')
 s+=poly([(0,-.83),(.135,-.35),(.1,.14),(0,.25),(-.1,.14),(-.135,-.35)],'#233e4f')
 s+=poly([(0,-.7),(.053,-.28),(.04,.04),(0,.11),(-.04,.04),(-.053,-.28)],'#a6ffe1')
 return s
for label,w,h in [('landscape',1920,1080),('portrait',800,1200),('square',800,800)]:
 wide=w>h;x=w*.73 if wide else w*.57;y=h*.55 if wide else h*.61;size=220 if wide else 145
 rnd=random.Random(42);s=f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}">'
 s+='<defs><radialGradient id="nebula"><stop stop-color="#214b54"/><stop offset="1" stop-color="#060e1b"/></radialGradient><radialGradient id="planet" cx=".25" cy=".2"><stop stop-color="#6e918e"/><stop offset=".35" stop-color="#263d4d"/><stop offset="1" stop-color="#0b1828"/></radialGradient></defs>'
 s+=f'<rect width="{w}" height="{h}" fill="#060e1b"/><ellipse cx="{x}" cy="{y}" rx="{w*.8}" ry="{h*.9}" fill="url(#nebula)"/>'
 for i in range(90):s+=f'<circle cx="{rnd.randrange(w)}" cy="{rnd.randrange(h)}" r="{rnd.choice([1,1.2,2])}" fill="#aec8ce" opacity="{rnd.uniform(.15,.55)}"/>'
 s+=f'<circle cx="{w*.8}" cy="{h*.18}" r="{w*.3}" fill="url(#planet)" stroke="#9acaaf33" stroke-width="2"/>'
 for r in [1.6,2,2.4]:s+=f'<ellipse cx="{x}" cy="{y}" rx="{size*r}" ry="{size*r*.5}" transform="rotate(-30 {x} {y})" fill="none" stroke="#a4ead51e" stroke-width="2"/>'
 # Voidkeeper silhouette echoes the in-game three-wing hull.
 s+=f'<g transform="translate({x+95 if w==h else x-140} {y-200}) rotate(12) scale({size*.66})" opacity=".62">'
 s+=poly([(0,-.9),(.4,-.5),(1.4,-.7),(1.2,.7),(.55,.25),(0,1),(-.55,.25),(-1.2,.7),(-1.4,-.7),(-.4,-.5)],'#302444','#d7a6c5',.02)
 s+=poly([(0,-.6),(.32,0),(0,.6),(-.32,0)],'#cdb8e4','#ffe3ea',.02)+'</g>'
 s+=f'<g transform="translate({x} {y}) rotate(22) scale({size})">'+ship()+'</g>'
 tx=110 if wide else 58;ty=390 if wide else 140;fs=260 if wide else 130
 s+=title('NEON',tx,ty,fs,'#edf7f1')+title('RIFT',tx,ty+fs*.9,fs,'#92f5d5')+'</svg>'
 svg=out/f'cover-{label}.svg';svg.write_text(s)
 cairosvg.svg2png(bytestring=s.encode(),write_to=str(out/f'cover-{label}.png'))
 print(label,w,h)

from sqlalchemy.orm import Session

from app.models import BlogPost, Category

IMG = {
    "pottery": "https://images.unsplash.com/photo-1578749556568-bc2c184e1dde?w=800",
    "ceramics": "https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=800",
    "chakan": "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800",
    "textile": "https://images.unsplash.com/photo-1590736969955-71cc94901354?w=800",
    "jewelry": "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800",
    "wood": "https://images.unsplash.com/photo-1533090161767-e6ffed986c88?w=800",
    "honey": "https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=800",
    "nuts": "https://images.unsplash.com/photo-1599599810769-bcde5a160d32?w=800",
    "dried": "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=800",
    "bread": "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800",
    "avatar_f": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400",
    "avatar_m": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400",
    "blog1": "https://images.unsplash.com/photo-1452860606245-08befc0ff44b?w=800",
    "blog2": "https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=800",
    "blog3": "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800",
}


def seed_if_empty(db: Session) -> None:
    if not db.query(Category).first():
        categories = [
            Category(name="Кулолгарӣ", slug="pottery", description="Зарфҳо ва сафолҳои дастӣ", icon_image=IMG["pottery"]),
            Category(name="Чакан", slug="chakan", description="Либос ва нақшҳои миллии чакан", icon_image=IMG["chakan"]),
            Category(name="Чӯбкорӣ", slug="woodwork", description="Кандакорӣ ва мебели дастӣ", icon_image=IMG["wood"]),
            Category(name="Заргарӣ", slug="jewelry", description="Зеварҳои анъанавӣ", icon_image=IMG["jewelry"]),
            Category(name="Хӯрока", slug="food", description="Маҳсулоти хӯрокаи ватанӣ", icon_image=IMG["honey"]),
            Category(name="Атлас ва адрас", slug="atlas", description="Матоъҳои абрешимӣ", icon_image=IMG["textile"]),
        ]
        db.add_all(categories)

    if not db.query(BlogPost).first():
        db.add_all([
            BlogPost(
                title="Таърихи чӯбкорӣ дар Тоҷикистон",
                excerpt="Кандакории чӯб аз асрҳои миёна то имрӯз.",
                body="Чӯбкории тоҷикӣ дар меъморӣ, сандуқҳо, сутунҳо ва асбобҳои рӯзгор нақши калон дорад. Устоҳо нақшҳои ислимӣ, ситора ва гулро бо даст мекананд. Барои нигоҳубин равғани махсуси чӯб ва парҳез аз намиро тавсия медиҳем.",
                cover_image=IMG["blog1"],
            ),
            BlogPost(
                title="Сирри нақшҳои чакан",
                excerpt="Ҳар гул дар чакан маънои худро дорад.",
                body="Чакан либос ва рӯйпӯши дастдӯз аст. Гулу барги сурх — ҳаёт, сабз — баракат, зарҳал — офтоб. Дар Hunarmand шумо метавонед фармоиши инфиродӣ бо нақши дилхоҳ диҳед.",
                cover_image=IMG["blog2"],
            ),
            BlogPost(
                title="Кулолгарии Истаравшан",
                excerpt="Гил, оташ ва дасти устод.",
                body="Истаравшан маркази қадимии кулолгарӣ аст. Ранги кабуд ва сабзи зарфҳо аз оксидҳои маҳаллӣ пайдо мешавад. Зарфҳои дастиро бо оби гарм бишӯед ва аз зарба эҳтиёт кунед.",
                cover_image=IMG["pottery"],
            ),
        ])
    db.commit()

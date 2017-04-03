select g.G_ID, g.LAT, g.LON, g.SITE_CODE, g.SITE_NAME, g.STATUS, 'Rain' as type, r.count as count
from tblGaugeLLID as g
left join (
    select G_ID, count(R_Date) as count
    from tblRainDaily
    group by G_ID) as r
    on g.G_ID = r.G_ID
where STATUS = 'Active'
  and Not Precip = 0
  and count > 0

UNION

select g.G_ID, g.LAT, g.LON, g.SITE_CODE, g.SITE_NAME, g.STATUS, 'Flow' as type, d.count as count
from tblGaugeLLID as g
left join (
    select G_ID, count(D_Date) as count
    from tblDischargeDaily
    group by G_ID) as d
    on g.G_ID = d.G_ID
where STATUS = 'Active'
  and Not FlowLevel = 0
  and count > 0

UNION

select g.G_ID, g.LAT, g.LON, g.SITE_CODE, g.SITE_NAME, g.STATUS, 'Well' as type, p.count as count
from tblGaugeLLID as g
left join (
    select G_ID, count(P_Date) as count
    from tblPiezometerDaily
    group by G_ID) as p
    on g.G_ID = p.G_ID
where STATUS = 'Active'
  and Not Piezometer = 0
  and count > 0

ORDER BY type, SITE_CODE
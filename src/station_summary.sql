-----------------
--Summary of data
-----------------


select g.G_ID, g.SITE_CODE + ' - ' + g.SITE_NAME as site, d3.R_TimeDate as latest_sample, 'Rain' as type, d3.R_Value as last_val
from tblGaugeLLID as g
left join (
    select d1.R_TimeDate, d1.G_ID, d1.R_Value
    from tblRainGauging as d1
    inner join (
        select max(R_TimeDate) as R_TimeDate, G_ID
        from tblRainGauging
        group by G_ID) as d2
    on d1.G_ID = d2.G_ID and d1.R_TimeDate = d2.R_TimeDate) as d3
on g.G_ID = d3.G_ID
where STATUS = 'Active'
  and Not Precip = 0

UNION

select g.G_ID, g.SITE_CODE + ' - ' + g.SITE_NAME as site, d3.D_TimeDate as latest_sample, 'Flow' as type, d3.D_Stage as last_val
from tblGaugeLLID as g
left join (
    select d1.D_TimeDate, d1.G_ID, d1.D_Stage
    from tblDischargeGauging as d1
    inner join (
        select max(D_TimeDate) as D_TimeDate, G_ID
        from tblDischargeGauging
        group by G_ID) as d2
    on d1.G_ID = d2.G_ID and d1.D_TimeDate = d2.D_TimeDate) as d3
on g.G_ID = d3.G_ID
where STATUS = 'Active'
  and Not FlowLevel = 0

UNION

select g.G_ID, g.SITE_CODE + ' - ' + g.SITE_NAME as site, d3.P_TimeDate as latest_sample, 'Well' as type, d3.P_Value as last_val
from tblGaugeLLID as g
left join (
    select d1.P_TimeDate, d1.G_ID, d1.P_Value
    from tblPiezometerGauging as d1
    inner join (
        select max(P_TimeDate) as P_TimeDate, G_ID
        from tblPiezometerGauging
        group by G_ID) as d2
    on d1.G_ID = d2.G_ID and d1.P_TimeDate = d2.P_TimeDate) as d3
on g.G_ID = d3.G_ID
where STATUS = 'Active'
  and Not Piezometer = 0

ORDER BY type, site
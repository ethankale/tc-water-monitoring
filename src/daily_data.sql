select G_ID, D_Date as day, D_MeanStage as val
from tblDischargeDaily

union

select G_ID, P_Date as day, P_MeanLevel as val
from tblPiezometerDaily

union

select G_ID, R_Date as day, R_TotalRain as val
from tblRainDaily